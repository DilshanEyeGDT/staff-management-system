using System.Text.Json.Nodes;

namespace StaffManagement.Persistence
{
    public class JsonConversions
    {
        public static string? Serialize(JsonNode? node)
        {
            return node?.ToJsonString();
        }

        public static JsonNode? Deserialize(string? json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            return JsonNode.Parse(json, null); // explicitly pass null for JsonNodeOptions
        }
    }
}
